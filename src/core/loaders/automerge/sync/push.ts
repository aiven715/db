import { ChangeEvent } from '~/core/change-stream'

import { BINARY_DIFF_SYMBOL } from '../constants'
import { ForkEntry } from '../types'

export type PushEvent = {
  id: string
  diff: Uint8Array[]
}

export const createPushEvent = async (
  changeEvent: ChangeEvent
): Promise<PushEvent> => {
  const promise = (changeEvent.entry as ForkEntry)[BINARY_DIFF_SYMBOL]!
  return promise.then((diff) => ({
    id: changeEvent.entry.id as string,
    diff,
  }))
}
