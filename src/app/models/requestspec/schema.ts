import z from 'zod'

export type RequestSpecEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string(),
  collectionId: z.string().or(z.null()).default(null),
  name: z.string(),
  method: z.string().default('GET'),
  url: z.string().default(''),
  body: z.object({
    text: z.object({
      value: z.string().default(''),
    }),
  }),
})

export const defaults: Partial<RequestSpecEntry> = {
  collectionId: null,
  name: '',
  method: 'GET',
  url: '',
  body: {
    text: {
      value: '',
    },
  },
}
