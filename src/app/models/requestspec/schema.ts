import { uuid } from '@automerge/automerge'
import z from 'zod'

export type RequestSpecEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string().default(() => uuid()),
  collectionId: z.string().or(z.null()).default(null),
  name: z.string(),
  method: z.string().default('GET'),
  url: z.string().default(''),
  body: z.string().default(''),
})
