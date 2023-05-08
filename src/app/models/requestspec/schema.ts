import z from 'zod'

export type RequestSpecEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string().uuid(),
  collectionId: z.string().uuid().or(z.null()),
  name: z.string(),
  method: z.string(),
  url: z.string(),
  body: z.string(),
})
