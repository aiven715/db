import z from 'zod'

import { DeepPartial } from '~/library/types'

import { PROFILE_ID } from './constants'

export type ProfileEntry = z.infer<typeof schema>

export enum Theme {
  LIGHT = 'light',
  AUTO = 'auto',
  DARK = 'dark',
}

export const schema = z.object({
  id: z.string(),
  appTheme: z.enum([Theme.AUTO, Theme.LIGHT, Theme.DARK]),
  appFollowRedirects: z.boolean(),
  appSslVerify: z.boolean(),
})

export const defaults: DeepPartial<ProfileEntry> = {
  id: PROFILE_ID,
  appTheme: Theme.AUTO,
  appFollowRedirects: true,
  appSslVerify: true,
}
