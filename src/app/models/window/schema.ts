import z from 'zod'

import { DeepPartial } from '~/library/types'

export type ApplicationWindowEntry = z.infer<typeof schema>

export enum SidebarContent {
  Library = 'library',
}

export const schema = z.object({
  id: z.string(),
  selectedSpaceId: z.string(),
  sidebar: z.object({
    content: z.enum([SidebarContent.Library]).optional(),
    size: z.number(),
  }),
  drafts: z.object({
    collapsed: z.boolean(),
  }),
  collections: z.record(
    z.object({
      collapsed: z.boolean(),
    })
  ),
  spaces: z.record(
    z.object({
      selectedTabId: z.string(),
      selectedEnvironmentId: z.string().or(z.null()),
    })
  ),
})

export const defaults: DeepPartial<ApplicationWindowEntry> = {
  sidebar: {
    content: SidebarContent.Library,
    size: 25,
  },
  drafts: {
    collapsed: false,
  },
  collections: {},
  spaces: {},
}
