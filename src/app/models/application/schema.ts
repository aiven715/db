import z from 'zod'

import { DeepPartial } from '~/library/types'

export type ApplicationEntry = z.infer<typeof schema>

export const schema = z.object({
  id: z.string(),
  usePointerCursors: z.boolean(),
  requestCount: z.number(),
  feedbackPromptDismissed: z.boolean(),
  importBannerDismissed: z.boolean(),
  lastSeenPromo: z.string().nullable(),
})

export const defaults: DeepPartial<ApplicationEntry> = {
  usePointerCursors: false,
  requestCount: 0,
  feedbackPromptDismissed: false,
  importBannerDismissed: false,
  lastSeenPromo: null,
}
