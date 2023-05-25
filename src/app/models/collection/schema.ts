import z from 'zod'

export type CollectionEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string(),
  // createdAt: z.number().default(() => Date.now()),
  name: z.string(),
})

export const defaults: Partial<CollectionEntry> = {
  name: '',
}
