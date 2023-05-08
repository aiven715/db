import z from 'zod'

export type CollectionEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string().uuid(),
  updatedAt: z.date(),
  name: z.string(),
})
